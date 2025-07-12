import { memo, useCallback, useEffect, useMemo, } from '../../lib/teact/teact';
import { formatCurrency } from '../../util/formatCurrency';
import useLang from '../../hooks/useLang';
import useOldLang from '../../hooks/useOldLang';
import RadioGroup from '../ui/RadioGroup';
import './Shipping.scss';
const Shipping = ({ state, shippingOptions, currency, dispatch, }) => {
    const oldLang = useOldLang();
    const lang = useLang();
    useEffect(() => {
        if (!shippingOptions || !shippingOptions.length || state.shipping) {
            return;
        }
        dispatch({ type: 'changeShipping', payload: shippingOptions[0].id });
    }, [shippingOptions, state.shipping, dispatch]);
    const handleShippingSelect = useCallback((value) => {
        dispatch({ type: 'changeShipping', payload: value });
    }, [dispatch]);
    const options = useMemo(() => (shippingOptions.map(({ id: value, title: label, amount }) => ({
        label,
        subLabel: formatCurrency(lang, amount, currency),
        value,
    }))), [shippingOptions, currency, lang]);
    return (<div className="Shipping">
      <form>
        <p>{oldLang('PaymentShippingMethod')}</p>
        <RadioGroup name="shipping-options" options={options} onChange={handleShippingSelect} selected={state.shipping}/>
      </form>
    </div>);
};
export default memo(Shipping);
