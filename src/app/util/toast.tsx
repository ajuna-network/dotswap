import { toast, ToastOptions } from "react-hot-toast";
import Toaster from "../../components/atom/Toaster";
import { ToasterType } from "../types/enum";

interface DotAcpToast {
  success: (message: string, options?: ToastOptions, blockExplorerLink?: string) => void;
  error: (message: string, options?: ToastOptions, blockExplorerLink?: string | null) => void;
  pending: (message: string, options?: ToastOptions, blockExplorerLink?: string | null) => void;
}

const dotAcpToast: DotAcpToast = {
  success: (message, options, blockExplorerLink) => {
    toast.custom(
      (t) => (
        <Toaster
          description={message}
          close={() => {
            toast.remove(t.id);
          }}
          type={ToasterType.SUCCESS}
          blockExplorerLink={blockExplorerLink}
        />
      ),
      { ...options, id: options?.id || new Date().getTime().toString() }
    );
  },
  pending: (message, options, blockExplorerLink) => {
    toast.custom(
      (t) => (
        <Toaster
          description={message}
          close={() => {
            toast.remove(t.id);
          }}
          type={ToasterType.PENDING}
          blockExplorerLink={blockExplorerLink}
        />
      ),
      { ...options, id: options?.id || new Date().getTime().toString() }
    );
  },
  error: (message, options, blockExplorerLink) => {
    toast.custom(
      (t) => (
        <Toaster
          description={message}
          close={() => {
            toast.remove(t.id);
          }}
          type={ToasterType.ERROR}
          blockExplorerLink={blockExplorerLink}
        />
      ),
      { ...options, id: options?.id || new Date().getTime().toString() }
    );
  },
};

export default dotAcpToast;
