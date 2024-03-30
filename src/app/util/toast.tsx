import { toast, ToastOptions } from "react-hot-toast";
import Toaster from "../../components/atom/Toaster";
import { ToasterType } from "../types/enum";

interface DotAcpToast {
  success: (message: string, options?: ToastOptions, blockExplorerLink?: string) => void;
  error: (message: string, options?: ToastOptions) => void;
  pending: (message: string, options?: ToastOptions) => void;
}

const dotAcpToast: DotAcpToast = {
  success: (message, options, blockExplorerLink) => {
    toast.custom(
      (t) => (
        <Toaster
          description={message}
          close={() => toast.dismiss(t.id)}
          type={ToasterType.SUCCESS}
          blockExplorerLink={blockExplorerLink}
        />
      ),
      options
    );
  },
  pending: (message, options) => {
    toast.custom(
      (t) => <Toaster description={message} close={() => toast.dismiss(t.id)} type={ToasterType.PENDING} />,
      options
    );
  },
  error: (message, options) => {
    toast.custom(
      (t) => <Toaster description={message} close={() => toast.dismiss(t.id)} type={ToasterType.ERROR} />,
      options
    );
  },
};

export default dotAcpToast;
