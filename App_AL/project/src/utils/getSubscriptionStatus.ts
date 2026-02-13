import { getFirestore, doc, getDoc } from "firebase/firestore";

export const getSubscriptionStatus = async (uid: string): Promise<string> => {
  const db = getFirestore();
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    return data.subscriptionStatus || "inactive";
  }
  return "inactive";
};

