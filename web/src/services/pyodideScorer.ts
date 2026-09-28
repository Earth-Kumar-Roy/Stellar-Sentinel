import { supabase } from '../config/supabase';

declare global {
  interface Window {
    loadPyodide: (options?: { indexURL?: string }) => Promise<any>;
  }
}

let pyodideInstance: any = null;
let initPromise: Promise<any> | null = null;

async function getPyodideInstance(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (typeof window.loadPyodide !== 'function') {
      throw new Error('Pyodide script failed to load from CDN.');
    }

    const pyodide = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
    });

    // Load pre-compiled binary packages required by pipeline.py
    await pyodide.loadPackage(['numpy', 'scikit-learn', 'joblib']);

    // Fetch the raw Python scripts from public assets
    const [pipelineCode, riskScorerCode] = await Promise.all([
      fetch('/py_agent/pipeline.py').then((res) => res.text()),
      fetch('/py_agent/risk_scorer.py').then((res) => res.text()),
    ]);

    // Create filesystem directories in the virtual WASM environment
    pyodide.FS.mkdirTree('/home/pyodide/ml/models');
    pyodide.FS.mkdirTree('/home/pyodide/engine');

    // Fetch and mount the Isolation Forest joblib weights
    try {
      const modelBuffer = await fetch('/py_agent/models/isolation_forest.joblib').then((res) =>
        res.arrayBuffer()
      );
      pyodide.FS.writeFile(
        '/home/pyodide/ml/models/isolation_forest.joblib',
        new Uint8Array(modelBuffer)
      );
    } catch {
      // Model initialises automatically if binary weights are absent
    }

    // Mount unchanged Python scripts inside the virtual filesystem
    pyodide.FS.writeFile('/home/pyodide/ml/pipeline.py', pipelineCode);

    // Mock core.supabase client bridge in Python so unchanged imports succeed
    pyodide.runPython(`
import sys
sys.path.append('/home/pyodide')

class MockTable:
    def __init__(self, data):
        self._data = data
    def select(self, *args, **kwargs): return self
    def eq(self, *args, **kwargs): return self
    def neq(self, *args, **kwargs): return self
    def order(self, *args, **kwargs): return self
    def limit(self, *args, **kwargs): return self
    def execute(self):
        class Res:
            def __init__(self, d): self.data = d
        return Res(self._data)

class MockSupabase:
    def __init__(self):
        self.payloads = {}
    def set_data(self, key, data):
        self.payloads[key] = data
    def table(self, name):
        return MockTable(self.payloads.get(name, []))

class MockCore:
    supabase = MockSupabase()

sys.modules['core'] = MockCore
    `);

    // Load the untouched risk_scorer logic into the Python runtime
    pyodide.runPython(riskScorerCode);

    pyodideInstance = pyodide;
    return pyodide;
  })();

  return initPromise;
}

export async function runPythonRiskEvaluation(params: {
  intentId: number;
  sender: string;
  recipient: string;
  amount: number;
  assetAddress: string;
  dailyLimit?: number;
  purposeHashHex?: string;
  orgName?: string;
}) {
  const pyodide = await getPyodideInstance();

  // 1. Fetch necessary database context via browser's active Supabase connection
  const [orgRes, txRes, globalRes] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, is_verified')
      .eq('wallet_address', params.recipient.trim())
      .limit(1),
    supabase
      .from('transactions_testnet')
      .select('id, intent_id, total_amount, created_at, status, note, description, from_wallet, cosigner_1_name, cosigner_2_name')
      .eq('to_wallet', params.recipient.trim())
      .order('created_at', { ascending: true }),
    supabase
      .from('transactions_testnet')
      .select('total_amount, created_at, status, to_wallet')
      .eq('status', 'executed')
      .order('created_at', { ascending: false })
      .limit(25),
  ]);

  // 2. Feed retrieved records into the Pyodide database mock
  pyodide.globals.set('_org_data', orgRes.data || []);
  pyodide.globals.set('_tx_data', txRes.data || []);
  pyodide.globals.set('_global_data', globalRes.data || []);

  pyodide.runPython(`
import sys
core = sys.modules['core']
core.supabase.set_data('organizations', _org_data.to_py() if hasattr(_org_data, 'to_py') else _org_data)
core.supabase.set_data('transactions_testnet', _tx_data.to_py() if hasattr(_tx_data, 'to_py') else _tx_data)
  `);

  // 3. Call calculate_composite_risk directly in Python
  const pyArgs = JSON.stringify({
    intent_id: params.intentId || 0,
    sender: params.sender,
    recipient: params.recipient,
    amount: params.amount,
    asset_address: params.assetAddress,
    daily_limit: params.dailyLimit || 50000.0,
    timestamp_epoch: Math.floor(Date.now() / 1000),
    purpose_hash_hex: params.purposeHashHex || '',
    org_name: params.orgName || 'none',
  });

  const evaluationResultJson = pyodide.runPython(`
import json
args = json.loads('''${pyArgs}''')

score, features, rationale, should_challenge = calculate_composite_risk(
    intent_id=args['intent_id'],
    sender=args['sender'],
    recipient=args['recipient'],
    amount=args['amount'],
    asset_address=args['asset_address'],
    daily_limit=args['daily_limit'],
    timestamp_epoch=args['timestamp_epoch'],
    purpose_hash_hex=args['purpose_hash_hex'],
    org_name=args['org_name']
)

json.dumps({
    "risk_score": round(score, 2),
    "feature_vector": [round(f, 4) for f in features],
    "rationale": rationale,
    "should_challenge": should_challenge
})
  `);

  return JSON.parse(evaluationResultJson);
}