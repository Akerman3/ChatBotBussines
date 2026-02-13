import { useState, useEffect } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const useSubscriptionStatus = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"active" | "inactive" | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setStatus(null);
        setLoading(false);
        return;
      }

      const db = getFirestore();
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setStatus(data.subscriptionStatus || "inactive");
      } else {
        setStatus("inactive");
      }
      setLoading(false);
    };

    fetchStatus();
  }, []);

  return { loading, status };
};
