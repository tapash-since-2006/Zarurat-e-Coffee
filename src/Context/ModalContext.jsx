import React, { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modalContent, setModalContent] = useState(null);

  const openModal = (content) => setModalContent(content);
  const closeModal = () => setModalContent(null);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {modalContent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {modalContent}
          </div>
          <style>{`
            .modal-overlay {
              position: fixed; top: 0; left: 0; right: 0; bottom: 0;
              background: rgba(0,0,0,0.5);
              display: flex; justify-content: center; align-items: center;
              z-index: 1000;
            }
            .modal {
              background: white; padding: 20px; border-radius: 8px;
              max-width: 400px; width: 90%;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
          `}</style>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}
