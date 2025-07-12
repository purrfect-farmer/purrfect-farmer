import { getGlobal, setGlobal, withGlobal } from '../../global';
document.ondblclick = () => {
    const value = Math.random();
    let global = getGlobal();
    global = {
        ...global,
        bValue: value,
        aValue: value,
    };
    setGlobal(global);
};
const TestB = ({ bValue, aValue, derivedAValue }) => {
    // eslint-disable-next-line no-console
    console.log('!!! B MOUNT ', { bValue, aValue, derivedAValue });
    return (<div className="TestB">
      <h2>B</h2>
      <div>
        bValue =
        {' '}
        {bValue}
      </div>
      <div>
        aValue =
        {' '}
        {aValue}
      </div>
      <div>
        derivedAValue =
        {' '}
        {derivedAValue}
      </div>
      {bValue > 0.5 ? (<span key="hello" className="hello">Hello</span>) : (<span key="world" className="world">World</span>)}
    </div>);
};
const TestBContainer = withGlobal((global, { aValue }) => {
    // eslint-disable-next-line no-console
    console.log('!!! B MAP', { aValue });
    return {
        // @ts-ignore
        bValue: global.bValue,
        derivedAValue: (aValue || 0) + 1,
    };
})(TestB);
const TestA = ({ aValue }) => {
    // eslint-disable-next-line no-console
    console.log('!!! A MOUNT ', { aValue });
    return (<div>
      <h1>A</h1>
      <div>
        aValue =
        {' '}
        {aValue}
      </div>
      <TestBContainer aValue={aValue}/>
    </div>);
};
export default withGlobal((global) => {
    // @ts-ignore
    // eslint-disable-next-line no-console
    console.log('!!! A MAP', { aValue: global.aValue });
    return {
        // @ts-ignore
        aValue: global.aValue,
    };
})(TestA);
