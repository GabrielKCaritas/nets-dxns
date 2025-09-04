/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall, onRequest } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import crypto from "crypto";
import * as logger from "firebase-functions/logger";
import type {
  OrderRequest,
  OrderResponse,
  TransactionQueryResponse,
} from "./types/transaction";

initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const netsClientId = defineString("NETS_CLIENT_ID");
const netsClientSecret = defineString("NETS_CLIENT_SECRET");

/**
 * Helper function to format Date as MMDD and HHMMSS
 * @param date Date object
 * @return Object containing dateStr (MMDD) and timeStr (HHMMSS)
 */
function formatDate(date: Date): { dateStr: string; timeStr: string } {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return {
    dateStr: pad(date.getMonth() + 1) + pad(date.getDate()), // MMDD
    timeStr:
      pad(date.getHours()) + pad(date.getMinutes()) + pad(date.getSeconds()), // HHMMSS
  };
}

/**
 * Make request payload
 * @param amtCents Amount in cents, padded to 12 digits
 * @param txnDatetime Transaction date and time
 * @param webhookUrl Webhook URL to receive transaction result
 * @param creds Credentials object containing clientId
 * @param terminalId Terminal ID, default "37066801"
 * @param merchantId Merchant ID, default "11137066800"
 * @param institutionCode Institution code, default "20000000001"
 * @return Request payload object
 */
function createOrderRequest(
  amtCents: string,
  txnDatetime: Date,
  webhookUrl: string,
  creds: { clientId: string },
  terminalId = "37066801",
  merchantId = "11137066800",
  institutionCode = "20000000001"
) {
  const { dateStr: txnDate, timeStr: txnTime } = formatDate(txnDatetime);

  return {
    mti: "0200",
    process_code: "990000",
    amount: amtCents,
    stan: "100001",
    transaction_date: txnDate,
    transaction_time: txnTime,
    entry_mode: "000",
    condition_code: "85",
    institution_code: institutionCode,
    host_tid: terminalId,
    host_mid: merchantId,
    npx_data: {
      E103: terminalId,
      E201: "00000123",
      E202: "SGD",
    },
    communication_data: [
      {
        type: "https_proxy",
        category: "URL",
        destination: webhookUrl,
        addon: {
          external_API_keyID: creds.clientId,
        },
      },
    ],
    getQRCode: "Y",
  } satisfies OrderRequest;
}

/**
 * Function to generate signature for a given payload string and secret key
 * @param payload Payload string
 * @param secretKey Secret key
 * @return Base64 encoded SHA-256 hash signature
 */
function generateSignature(payload: string, secretKey: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(payload + secretKey, "utf-8")
    .digest();
  return hash.toString("base64");
}

function txnIdToDocIdBase64(txnIdentifier: string): string {
  const hash = crypto.createHash("sha256").update(txnIdentifier).digest();
  return hash.toString("base64url").slice(0, 22); // base64 URL safe
}

export const createNetsTransaction = onCall(
  { region: "asia-southeast1" },
  async () => {
    // Check if user is authenticated
    // if (!request.auth) {
    //   throw new Error("unauthenticated");
    // }

    const amountCents = 100;
    const webhookUrl =
      "https://onnetstransactionupdate-fpiysdgzaq-as.a.run.app";

    const now = new Date();

    const orderRequest = createOrderRequest(
      amountCents.toString().padStart(12, "0"),
      now,
      webhookUrl,
      { clientId: netsClientId.value() }
    );

    const orderRequestStr = JSON.stringify(orderRequest);

    const orderSig = generateSignature(
      orderRequestStr,
      netsClientSecret.value()
    );

    const url =
      "https://uat-api.nets.com.sg/uat/merchantservices/qr/dynamic/v1/order/request";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Sign: orderSig,
        KeyId: netsClientId.value(),
      },
      body: orderRequestStr,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const orderRes = (await response.json()) as OrderResponse;

    const id = txnIdToDocIdBase64(orderRes.txn_identifier);

    const db = getFirestore();

    await db.collection("netstxns").doc(id).set({
      createdAt: now,
      updatedAt: now,
      status: "PENDING",
    });

    return {
      ok: orderRes.response_code === "00",
      orderResponse: orderRes,
      docId: id,
    };
  }
);

export const onNetsTransactionUpdate = onRequest(
  { region: "asia-southeast1" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send({ error: "Method not allowed" });
      return;
    }

    logger.info("Received request", { body: req.body });

    const txnQueryRes = req.body as TransactionQueryResponse;
    const id = txnIdToDocIdBase64(txnQueryRes.txn_identifier);

    const db = getFirestore();

    const docRef = db.collection("netstxns").doc(id);

    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).send({ error: "Transaction not found" });
      return;
    }

    const now = new Date();

    const status =
      txnQueryRes.response_code === "00"
        ? "SUCCESS"
        : txnQueryRes.response_code === "09"
          ? "PENDING"
          : "FAILED";

    await docRef.update({
      updatedAt: now,
      status,
      response: txnQueryRes,
    });

    res
      .status(status === "FAILED" ? 400 : status === "PENDING" ? 202 : 200)
      .json({ status });
  }
);
