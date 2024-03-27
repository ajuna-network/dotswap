import classNames from "classnames";
import { t } from "i18next";
import { ActionType, ButtonVariants } from "../../../app/types/enum";
import { useRef, useState, useEffect } from "react";
import { useAppContext } from "../../../state";
import { isWalletAddressValid } from "../../../app/util/helper";
import AlertIcon from "../../../assets/img/alert-icon.svg?react";
import Modal from "../../atom/Modal";
import Button from "../../atom/Button";

type DestinationWalletAddressProps = {
  chainName: string;
  isPopupEdit?: boolean;
};

const DestinationWalletAddress = ({ chainName, isPopupEdit = true }: DestinationWalletAddressProps) => {
  const { state, dispatch } = useAppContext();

  const { selectedAccount, crosschainDestinationWalletAddress } = state;

  const [disabled, setDisabled] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isAddressValid, setIsAddressValid] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setInputValue(selectedAccount?.address || "Waiting for wallet connection");
    dispatch({ type: ActionType.SET_CROSSCHAIN_DESTINATION_WALLET_ADDRESS, payload: selectedAccount?.address });
  }, [selectedAccount]);

  const handleAddressChange = (value: string) => {
    setInputValue(value);
  };

  const handleAddressValidation = (value: string) => {
    if (isWalletAddressValid(value)) {
      dispatch({ type: ActionType.SET_CROSSCHAIN_DESTINATION_WALLET_ADDRESS, payload: value });
      setIsAddressValid(true);
      setDisabled(!disabled);
      isPopupEdit && setOpen(false);
    } else {
      setIsAddressValid(false);
    }
  };

  const onClose = () => {
    setInputValue(crosschainDestinationWalletAddress);
    isPopupEdit && setDisabled(true);
    isPopupEdit && setOpen(false);
    setIsAddressValid(true);
  };

  const onResetModal = () => {
    setInputValue(crosschainDestinationWalletAddress);
    setIsAddressValid(true);
  };

  return (
    <div className="flex w-full rounded-lg bg-purple-100 px-4 py-6">
      <div className="flex flex-1 flex-col items-start justify-center text-small font-normal tracking-[.3px]">
        <div className="text-gray-200">
          {t("destinationWalletAddress.destination")} {chainName} {t("destinationWalletAddress.address")}
        </div>
        {!isPopupEdit ? (
          <WalletAddressInputField
            className="bg-transparent"
            disabled={disabled}
            inputValue={inputValue}
            handleAddressChange={handleAddressChange}
            isAddressValid={isAddressValid}
            onClose={onClose}
            isPopupEdit={isPopupEdit}
          />
        ) : (
          <>
            <span className="text-gray-200">{crosschainDestinationWalletAddress}</span>
            <Modal isOpen={open} onClose={onClose} title={t("destinationWalletAddress.modalTitle")}>
              <div className="flex w-[391px] items-center justify-between py-4 text-small font-normal tracking-[.3px]">
                <WalletAddressInputField
                  className="!w-[391px] rounded-lg bg-purple-100 px-4 py-6 text-center"
                  disabled={disabled}
                  inputValue={inputValue}
                  handleAddressChange={handleAddressChange}
                  isAddressValid={isAddressValid}
                  onClose={onResetModal}
                  isPopupEdit={isPopupEdit}
                />
              </div>
              <hr className="mb-3 mt-3 w-full border-[0.7px] border-gray-50" />
              <div className="flex flex-row justify-center gap-[6px]">
                <button
                  className="flex w-full max-w-[160.5px] items-center justify-center px-4 py-3 font-unbounded-variable text-small leading-[13.2px] tracking-[.96px]"
                  onClick={onClose}
                >
                  {t(`destinationWalletAddress.modalCancel`)}
                </button>
                <Button
                  onClick={() => {
                    handleAddressValidation(inputValue);
                  }}
                  disabled={!isAddressValid}
                  variant={ButtonVariants.btnInteractivePink}
                  className="max-w-[160.5px] !rounded-full !px-4 !py-3 !font-unbounded-variable text-small !leading-[13.2px] tracking-[.96px]"
                >
                  {t(`destinationWalletAddress.modalConfirm`)}
                </Button>
              </div>
            </Modal>
          </>
        )}
      </div>
      <div className="px-4 py-3">
        {disabled || isPopupEdit ? (
          <button
            className="font-unbounded-variable text-small leading-[13.64px] tracking-[.96px] "
            onClick={() => {
              setDisabled(!disabled);
              isPopupEdit && setOpen(true);
            }}
            disabled={!crosschainDestinationWalletAddress}
          >
            {t("destinationWalletAddress.edit")}
          </button>
        ) : (
          <button
            className="font-unbounded-variable text-small leading-[13.64px] tracking-[.96px] "
            onClick={() => {
              handleAddressValidation(inputValue);
            }}
          >
            {t("destinationWalletAddress.done")}
          </button>
        )}
      </div>
    </div>
  );
};

export default DestinationWalletAddress;

type WalletAddressInputFieldProps = {
  className?: string | undefined;
  disabled: boolean;
  inputValue: string;
  handleAddressChange: (value: string) => void;
  isAddressValid: boolean;
  onClose: () => void;
  isPopupEdit: boolean;
};

const WalletAddressInputField = ({
  className,
  disabled,
  inputValue,
  handleAddressChange,
  isAddressValid,
  onClose,
  isPopupEdit,
}: WalletAddressInputFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        className={classNames(
          "w-full outline-none placeholder:text-gray-200",
          {
            "text-gray-200": disabled,
            "border border-solid border-alert !bg-alert !bg-opacity-10": !isAddressValid && !disabled,
          },
          className ? className : ""
        )}
        type="text"
        disabled={disabled}
        onChange={(e) => {
          handleAddressChange(e.target.value);
        }}
        value={inputValue}
      />
      {!isAddressValid && (
        <div
          className={`absolute left-0 flex translate-y-full items-center gap-[6px] ${!isPopupEdit ? "bottom-0" : "bottom-[-6px]"}`}
        >
          <AlertIcon width={16} height={16} />
          <span className="text-alert">{t("destinationWalletAddress.invalidAddress")}</span>

          <span>-</span>
          <button
            className="font-normal capitalize"
            onClick={() => {
              onClose();
            }}
          >
            {t("destinationWalletAddress.resetAddress")}
          </button>
        </div>
      )}
    </div>
  );
};
