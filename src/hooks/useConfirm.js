import { useState, useCallback } from "react";

export function useConfirm() {
  const [confirmData, setConfirmData] = useState(null);

  const confirm = useCallback((message, title = "确认操作") => {
    return new Promise((resolve) => {
      setConfirmData({ message, title, resolve });
    });
  }, []);

  const handleConfirm = useCallback((result) => {
    if (confirmData) {
      confirmData.resolve(result);
      setConfirmData(null);
    }
  }, [confirmData]);

  const cancelConfirm = useCallback(() => {
    if (confirmData) {
      confirmData.resolve(false);
      setConfirmData(null);
    }
  }, [confirmData]);

  return { confirmData, handleConfirm, cancelConfirm, confirm };
}
