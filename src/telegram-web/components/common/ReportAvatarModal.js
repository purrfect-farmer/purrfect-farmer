import { memo, useMemo, useState } from '../../lib/teact/teact';
import { getActions } from '../../global';
import useLastCallback from '../../hooks/useLastCallback';
import useOldLang from '../../hooks/useOldLang';
import Button from '../ui/Button';
import InputText from '../ui/InputText';
import Modal from '../ui/Modal';
import RadioGroup from '../ui/RadioGroup';
const ReportAvatarModal = ({ isOpen, peerId, photo, onClose, onCloseAnimationEnd, }) => {
    const { reportProfilePhoto } = getActions();
    const [selectedReason, setSelectedReason] = useState('spam');
    const [description, setDescription] = useState('');
    const handleReport = useLastCallback(() => {
        reportProfilePhoto({
            chatId: peerId, photo, reason: selectedReason, description,
        });
        onClose();
    });
    const handleSelectReason = useLastCallback((value) => {
        setSelectedReason(value);
    });
    const handleDescriptionChange = useLastCallback((e) => {
        setDescription(e.target.value);
    });
    const lang = useOldLang();
    const REPORT_OPTIONS = useMemo(() => [
        { value: 'spam', label: lang('lng_report_reason_spam') },
        { value: 'violence', label: lang('lng_report_reason_violence') },
        { value: 'pornography', label: lang('lng_report_reason_pornography') },
        { value: 'childAbuse', label: lang('lng_report_reason_child_abuse') },
        { value: 'copyright', label: lang('ReportPeer.ReasonCopyright') },
        { value: 'illegalDrugs', label: 'Illegal Drugs' },
        { value: 'personalDetails', label: 'Personal Details' },
        { value: 'other', label: lang('lng_report_reason_other') },
    ], [lang]);
    if (!peerId || !photo) {
        return undefined;
    }
    const title = lang('ReportPeer.Report');
    return (<Modal isOpen={isOpen} onClose={onClose} onEnter={isOpen ? handleReport : undefined} onCloseAnimationEnd={onCloseAnimationEnd} className="narrow" title={title}>
      <RadioGroup className="dialog-checkbox-group" name="report-message" options={REPORT_OPTIONS} onChange={handleSelectReason} selected={selectedReason}/>
      <InputText label={lang('lng_report_reason_description')} value={description} onChange={handleDescriptionChange}/>
      <div className="dialog-buttons">
        <Button color="danger" className="confirm-dialog-button" isText onClick={handleReport}>
          {lang('lng_report_button')}
        </Button>
        <Button className="confirm-dialog-button" isText onClick={onClose}>{lang('Cancel')}</Button>
      </div>
    </Modal>);
};
export default memo(ReportAvatarModal);
