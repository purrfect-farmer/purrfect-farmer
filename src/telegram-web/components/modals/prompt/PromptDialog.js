import { memo, useState } from '../../../lib/teact/teact';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';
import Button from '../../ui/Button';
import InputText from '../../ui/InputText';
import Modal from '../../ui/Modal';
import styles from './PromptDialog.module.scss';
const PromptDialog = ({ isOpen, title, subtitle, placeholder, submitText, maxLength, initialValue = '', onClose, onSubmit, }) => {
    const lang = useOldLang();
    const [text, setText] = useState(initialValue);
    const handleTextChange = useLastCallback((e) => {
        setText(e.target.value);
    });
    const handleSubmit = useLastCallback(() => {
        onSubmit(text);
    });
    return (<Modal className="narrow" title={title} isOpen={isOpen} onClose={onClose} isSlim>
      {Boolean(subtitle) && (<div className={styles.subtitle}>
          {subtitle}
        </div>)}
      <InputText placeholder={placeholder} value={text} onChange={handleTextChange} maxLength={maxLength} teactExperimentControlled/>
      <div className="dialog-buttons mt-2">
        <Button className="confirm-dialog-button" onClick={handleSubmit}>
          {submitText || lang('Save')}
        </Button>
        <Button className="confirm-dialog-button" isText onClick={onClose}>
          {lang('Cancel')}
        </Button>
      </div>
    </Modal>);
};
export default memo(PromptDialog);
