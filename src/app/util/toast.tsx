import { toast, ToastOptions } from "react-hot-toast";
import Toaster from "../../components/atom/Toaster";
import { ToasterType } from "../types/enum";

interface DotAcpToast {
  success: (message: string, options?: ToastOptions, blockExplorerLink?: string) => void;
  error: (message: string, options?: ToastOptions, blockExplorerLink?: string | null) => void;
  pending: (message: string, options?: ToastOptions, blockExplorerLink?: string | null) => void;
  info: (message: string, options?: ToastOptions, blockExplorerLink?: string | null) => void;
}

const dotAcpToast: DotAcpToast = {
  success: (message, options, blockExplorerLink) => {
    toast.custom(
      (t) => (
        <Toaster
          description={message}
          close={() => {
            toast.dismiss(t.id);
          }}
          type={ToasterType.SUCCESS}
          blockExplorerLink={blockExplorerLink}
        />
      ),
      options
    );
  },
  pending: (message, options, blockExplorerLink) => {
    toast.custom(
      (t) => (
        <Toaster
          description={message}
          close={() => {
            toast.dismiss(t.id);
          }}
          type={ToasterType.PENDING}
          blockExplorerLink={blockExplorerLink}
        />
      ),
      options
    );
  },
  error: (message, options, blockExplorerLink) => {
    toast.custom(
      (t) => (
        <Toaster
          description={message}
          close={() => {
            toast.dismiss(t.id);
          }}
          type={ToasterType.ERROR}
          blockExplorerLink={blockExplorerLink}
        />
      ),
      { ...options, duration: Infinity }
    );
  },
  info: (message, options, blockExplorerLink) => {
    toast.custom(
      (t) => (
        <Toaster
          description={message}
          close={() => {
            toast.dismiss(t.id);
          }}
          type={ToasterType.INFO}
          blockExplorerLink={blockExplorerLink}
        />
      ),
      options
    );
  },
};

export default dotAcpToast;
