import { memo, useEffect, useMemo, useState } from "../../../lib/teact/teact";
import { getActions, withGlobal } from "../../../global";
import { ACCOUNT_TTL_OPTIONS } from "../../../config.js";
import { getClosestEntry } from "../../../util/getClosestEntry.js";
import useLang from "../../../hooks/useLang";
import useLastCallback from "../../../hooks/useLastCallback";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";
import RadioGroup from "../../ui/RadioGroup.js";
import styles from "./DeleteAccountModal.module.scss";
const DAYS_PER_MONTH = 30;
const DeleteAccountModal = ({ modal, selfDestructAccountDays }) => {
  const { closeGiftCodeModal, closeDeleteAccountModal, setAccountTTL } =
    getActions();
  const lang = useLang();
  const isOpen = Boolean(modal);
  const [selectedOption, setSelectedOption] = useState();
  const optionToDays = useLastCallback((value) => {
    return Number(value) * DAYS_PER_MONTH;
  });
  const initialSelectedOption = useMemo(() => {
    if (!selfDestructAccountDays) return undefined;
    return getClosestEntry(
      ACCOUNT_TTL_OPTIONS,
      selfDestructAccountDays / DAYS_PER_MONTH
    ).toString();
  }, [selfDestructAccountDays]);
  useEffect(() => {
    if (initialSelectedOption) {
      setSelectedOption(initialSelectedOption);
    }
  }, [initialSelectedOption]);
  const options = useMemo(() => {
    return ACCOUNT_TTL_OPTIONS.map((months) => ({
      value: String(months),
      label: lang("Months", { count: months }, { pluralValue: 1 }),
    }));
  }, [lang]);
  const handleChange = useLastCallback((value) => {
    setSelectedOption(value);
  });
  const confirmHandler = useLastCallback(() => {
    if (!selectedOption) return;
    setAccountTTL({ days: optionToDays(selectedOption) });
  });
  const onCloseHandler = useLastCallback(() => {
    closeDeleteAccountModal();
  });
  return (
    <Modal
      isOpen={isOpen}
      title={lang("SelfDestructTitle")}
      onClose={closeGiftCodeModal}
      className={styles.root}
    >
      <p>{lang("SelfDestructSessionsDescription")}</p>
      <RadioGroup
        className="dialog-checkbox-group"
        name="quick-reaction-settings"
        options={options}
        selected={selectedOption}
        onChange={handleChange}
        withIcon
      />
      <div className="dialog-buttons mt-2">
        <Button
          className="confirm-dialog-button"
          isText
          onClick={confirmHandler}
        >
          {lang("Save")}
        </Button>
        <Button
          color="danger"
          className="confirm-dialog-button"
          isText
          onClick={onCloseHandler}
        >
          {lang("Cancel")}
        </Button>
      </div>
    </Modal>
  );
};
export default memo(
  withGlobal((global, { modal }) => {
    const { selfDestructAccountDays } = modal || {};
    return {
      selfDestructAccountDays,
    };
  })(DeleteAccountModal)
);
