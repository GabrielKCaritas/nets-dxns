// --------------------- Order ---------------------

export interface OrderRequest {
  mti: string; // 4-digit numeric string, e.g. "0200"
  process_code: string; // 6-digit numeric string, e.g. "990000"
  message_version?: string; // conditional numeric string, default "00" for standard
  amount: string; // 12-digit numeric string, mandatory
  transmission_time?: string; // optional 10-digit numeric string, MMDDhhmmss
  stan: string; // 6-digit numeric string, mandatory
  transaction_time: string; // 6-digit numeric string, hhmmss
  transaction_date: string; // 4-digit numeric string, MMDD
  entry_mode: string; // 3-digit numeric string, e.g. "000"
  condition_code: string; // 2-digit numeric string, e.g. "85"
  institution_code: string; // 11-digit numeric string
  retrieval_ref?: string; // optional String(12)
  host_tid: string; // 8-character string
  host_mid: string; // 15-character string
  acceptor_name?: string; // optional String(40)
  txn_identifier?: string; // conditional String(170), QR code string
  npx_data: NpxData; // mandatory map
  invoice_ref?: string; // optional String(16)
  user_data?: string; // optional String(150)
  communication_data?: Record<string, any>[]; // conditional JSON list
  getQRCode?: "Y"; // optional flag, "Y" if QR code required
}

export interface OrderResponse {
  mti: string; // 4-digit numeric string, e.g. "0210"
  process_code: string; // 6-digit numeric string, e.g. "990000"
  amount: string; // 12-digit numeric string, mandatory, echo from request
  stan: string; // 6-digit numeric string, echo from request
  transaction_time: string; // 6-digit numeric string, echo from request
  transaction_date: string; // 4-digit numeric string, echo from request
  entry_mode: string; // 3-digit numeric string
  condition_code: string; // 2-digit numeric string
  institution_code: string; // 11-digit numeric string
  retrieval_ref?: string; // optional, String(12)
  approval_code?: string; // optional, String(6)
  response_code: string; // mandatory, String(2)
  host_tid: string; // mandatory, String(8)
  txn_identifier: string; // mandatory, String(170), QR code string
  npx_data: NpxData; // mandatory map of additional info
  loyalty_data?: Record<string, any>[]; // optional list of maps
  invoice_ref?: string; // optional, String(16)
  qr_code?: string; // optional, Base64 PNG, up to 50000 chars
}

// --------------------- Shared Types ---------------------

export interface CommunicationData {
  type: string; // e.g., "https_proxy"
  category: string; // e.g., "URL"
  destination: string; // URL or mobile number
  addon?: Record<string, any>; // optional map of extra params
}

export interface NpxData {
  E103?: string; // POS ID, Numeric(8)
  E104?: string; // Transaction ID, Numeric(10)
  E107?: string; // EDC Batch Number, Numeric(6)
  E201?: string; // Source Amount, Numeric(12)
  E202?: string; // Source Currency, String(3)
  E204?: string; // Target Currency, String(3)
  F101?: string; // Transaction ID, Numeric(10)
  F200?: string; // Number of Currency Groups, Numeric(2)
  F201?: string; // Target Currency String(99)
  F202?: string; // Target Currency Long Text
  F203?: string; // Target Currency ISO Code
  F204?: string; // Exchange Rate
  F217?: string; // Payment Type Id
  F219?: string; // Bank Retrieval Ref#
  F800?: string; // Marketing Message
  F998?: string; // PWAP Error Message
  F999?: string; // PWAP Error Code
  [key: string]: any; // allow other dynamic NPX tags
}

// --------------------- Transaction Query ---------------------

export interface TransactionQueryRequest {
  mti: string; // "0100"
  process_code: string; // "330000"
  message_version?: string; // optional default "00"
  stan: string; // Numeric(6)
  transaction_time: string; // Numeric(6)
  transaction_date: string; // Numeric(4)
  entry_mode: string; // Numeric(3)
  condition_code: string; // Numeric(2)
  institution_code: string; // Numeric(11)
  retrieval_ref?: string; // String(12)
  host_tid: string; // String(8)
  host_mid: string; // String(15)
  txn_identifier: string; // QR code string
  npx_data: NpxData;
  invoice_ref?: string; // optional
  user_data?: string; // optional
}

export interface TransactionQueryResponse {
  mti: string; // "0110"
  process_code: string; // "330000"
  sof_uri: string; // String(999)
  stan: string; // echo
  transaction_time: string;
  transaction_date: string;
  entry_mode: string;
  condition_code: string;
  institution_code: string;
  retrieval_ref?: string;
  approval_code?: string;
  response_code: string; // mandatory
  host_tid: string;
  acceptor_name?: string;
  txn_identifier: string;
  npx_data: NpxData;
  loyalty_data?: Record<string, any>[]; // optional
  invoice_ref?: string;
}

// --------------------- Order Reversal ---------------------

export interface OrderReversalRequest {
  mti: string; // "0400"
  process_code: string;
  message_version?: string;
  amount: string;
  transmission_time?: string;
  stan: string;
  transaction_time: string;
  transaction_date: string;
  entry_mode: string;
  condition_code: string;
  institution_code: string;
  retrieval_ref?: string;
  host_tid: string;
  host_mid: string;
  txn_identifier?: string;
  npx_data: NpxData;
  invoice_ref?: string;
  user_data?: string;
}

export interface OrderReversalResponse {
  mti: string; // "0410"
  process_code: string;
  amount?: string;
  stan: string;
  transaction_time: string;
  transaction_date: string;
  entry_mode: string;
  condition_code: string;
  institution_code: string;
  retrieval_ref?: string;
  response_code: string; // "00"=approved, "68"=not found
  host_tid: string;
  host_mid: string;
  npx_data: NpxData;
  invoice_ref?: string;
  txn_identifier?: string;
}
