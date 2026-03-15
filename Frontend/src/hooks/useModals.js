import { useState, useCallback } from "react";

export default function useModals() {
  const [showCreateDir, setShowCreateDir] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showAccess, setShowAccess] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [modalData, setModalData] = useState({
    type: null,
    id: null,
    name: "",
    data: null,
  });

  const openCreateDir = useCallback(() => setShowCreateDir(true), []);
  const closeCreateDir = useCallback(() => setShowCreateDir(false), []);

  const openRename = useCallback((type, id, name) => {
    setModalData((prev) => ({ ...prev, type, id, name }));
    setShowRename(true);
  }, []);
  const closeRename = useCallback(() => setShowRename(false), []);

  const openShare = useCallback((id, name) => {
    setModalData((prev) => ({ ...prev, id, name }));
    setShowShare(true);
  }, []);
  const closeShare = useCallback(() => setShowShare(false), []);

  const openAccess = useCallback((id, name, data) => {
    setModalData((prev) => ({ ...prev, id, name, data }));
    setShowAccess(true);
  }, []);
  const closeAccess = useCallback(() => setShowAccess(false), []);

  const openDetails = useCallback((data) => {
    setModalData((prev) => ({ ...prev, data }));
    setShowDetails(true);
  }, []);
  const closeDetails = useCallback(() => setShowDetails(false), []);

  return {
    showCreateDir,
    showRename,
    showShare,
    showAccess,
    showDetails,
    modalData,
    setModalData,
    openCreateDir,
    closeCreateDir,
    openRename,
    closeRename,
    openShare,
    closeShare,
    openAccess,
    closeAccess,
    openDetails,
    closeDetails,
  };
}
