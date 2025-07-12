import { getActions, withGlobal } from '../../../global';
import { getCanAddContact, getUserFullName } from '../../../global/helpers';
import { selectUser } from '../../../global/selectors';
import { copyTextToClipboard } from '../../../util/clipboard';
import { formatPhoneNumberWithCode } from '../../../util/phoneNumber';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';
import Avatar from '../../common/Avatar';
import PeerColorWrapper from '../../common/PeerColorWrapper';
import Button from '../../ui/Button';
import styles from './Contact.module.scss';
const UNREGISTERED_CONTACT_ID = '0';
const Contact = ({ contact, user, phoneCodeList, noUserColors, }) => {
    const lang = useOldLang();
    const { openChat, openAddContactDialog, showNotification, openChatWithInfo, } = getActions();
    const { phoneNumber, userId } = contact;
    const isRegistered = userId !== UNREGISTERED_CONTACT_ID;
    const canAddContact = isRegistered && user && getCanAddContact(user);
    const handleOpenChat = useLastCallback(() => {
        openChat({ id: userId });
    });
    const handleAddContact = useLastCallback(() => {
        openAddContactDialog({ userId: user?.id });
    });
    const handleClick = useLastCallback(() => {
        if (user) {
            openChatWithInfo({ id: userId });
        }
        else {
            copyTextToClipboard(phoneNumber);
            showNotification({ message: lang('PhoneCopied') });
        }
    });
    return (<PeerColorWrapper noUserColors={noUserColors} peer={user} emojiIconClassName={styles.emojiIconBackground} className={styles.root}>
      <div className={styles.infoContainer} onClick={handleClick}>
        <Avatar size="medium" peer={user} text={getContactName(contact)}/>
        <div className={styles.info}>
          <div className={styles.name}>
            {user ? getUserFullName(user) : getContactName(contact)}
          </div>
          <div className={styles.phone}>
            {formatPhoneNumberWithCode(phoneCodeList, phoneNumber)}
          </div>
        </div>
      </div>
      {isRegistered && (<>
          <div className={styles.divider}/>
          <div className={styles.buttons}>
            <Button isText color="translucent" ripple size="tiny" onClick={handleOpenChat} className={styles.button}>
              {lang('SharedContactMessage')}
            </Button>
            {canAddContact && (<Button isText color="translucent" ripple size="tiny" onClick={handleAddContact} className={styles.button}>
                {lang('SharedContactAdd')}
              </Button>)}
          </div>
        </>)}
    </PeerColorWrapper>);
};
function getContactName(contact) {
    if (contact.firstName && contact.lastName) {
        return `${contact.firstName} ${contact.lastName}`;
    }
    if (contact.firstName) {
        return contact.firstName;
    }
    if (contact.lastName) {
        return contact.lastName;
    }
    return '';
}
export default withGlobal((global, { contact }) => {
    const { countryList: { phoneCodes: phoneCodeList }, } = global;
    const user = selectUser(global, contact.userId);
    return {
        user,
        phoneCodeList,
    };
})(Contact);
