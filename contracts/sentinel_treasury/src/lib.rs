#![no_std]

pub mod errors;
pub mod types;
pub mod storage;
pub mod contract;

#[cfg(test)]
mod test;

pub use contract::SentinelTreasury;
pub use contract::SentinelTreasuryClient;