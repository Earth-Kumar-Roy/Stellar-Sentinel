declare module 'pyodide' {
  export interface PyodideInterface {
    loadPackage: (packages: string | string[]) => Promise<void>;
    runPython: (code: string) => any;
    runPythonAsync: (code: string) => Promise<any>;
    globals: {
      get: (key: string) => any;
      set: (key: string, value: any) => void;
    };
    FS: {
      mkdirTree: (path: string) => void;
      writeFile: (path: string, data: string | Uint8Array) => void;
    };
  }

  export function loadPyodide(options?: {
    indexURL?: string;
  }): Promise<PyodideInterface>;
}