import { useEffect, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, getFirestore, onSnapshot } from "firebase/firestore";
import type {
  OrderResponse,
  TransactionQueryResponse,
} from "functions/src/types/transaction";

export function Transaction() {
  const functions = getFunctions(undefined, "asia-southeast1");
  const createNetsTransaction = httpsCallable<
    never,
    { ok: boolean; orderResponse: OrderResponse; docId: string }
  >(functions, "createNetsTransaction");

  const [isStarted, setIsStarted] = useState(false);
  const [docId, setDocId] = useState<string>();
  const [orderResponse, setOrderResponse] = useState<OrderResponse>();

  const [queryState, setQueryState] = useState<
    | {
        transactionQueryResponse: undefined;
        transactionStatus: undefined;
      }
    | {
        transactionQueryResponse: TransactionQueryResponse;
        transactionStatus: "PENDING" | "FAILED" | "SUCCESS";
      }
  >({
    transactionQueryResponse: undefined,
    transactionStatus: undefined,
  });

  const db = getFirestore();

  useEffect(() => {
    if (isStarted) {
      createNetsTransaction().then((result) => {
        setOrderResponse(result.data.orderResponse);
        setDocId(result.data.docId);
      });
    }
  }, [isStarted]);

  useEffect(() => {
    if (docId) {
      console.log("Attaching listener for docId", docId);
      return onSnapshot(doc(db, "netstxns", docId), (doc) => {
        const datum = doc.data();
        console.log({ datum });
        if (datum === undefined) {
          return;
        }
        setQueryState({
          transactionQueryResponse: datum.response,
          transactionStatus: datum.status,
        });
      });
    }
  }, [docId]);

  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <header className="flex flex-col items-center gap-9">
          <div className="w-[500px] max-w-[100vw] p-4">NETS Transaction</div>
        </header>
        <div className="max-w-[300px] w-full space-y-6 px-4">
          {!isStarted ? (
            <button
              className="btn"
              onClick={() => {
                setIsStarted(true);
              }}
            >
              Start
            </button>
          ) : queryState.transactionStatus === "SUCCESS" ? (
            "Payment Successful"
          ) : !orderResponse ? (
            "Loading..."
          ) : (
            <img
              src={`data:image/png;base64,${orderResponse.qr_code}`}
              alt="NETS QR Code"
              width={256}
              height={256}
            />
          )}
        </div>
      </div>
    </main>
  );
}
