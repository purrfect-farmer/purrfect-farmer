import { useState } from '../../lib/teact/teact';
import { withGlobal } from '../../global';
import ErrorTest from './ErrorTest';
import SubTest from './SubTest';
let lastTimeout;
const Test = ({ authState, globalRand }) => {
    // eslint-disable-next-line no-console
    console.log('rendering `Test`', authState, globalRand);
    const [ownRand, setOwnRand] = useState(0);
    if (lastTimeout) {
        clearTimeout(lastTimeout);
        lastTimeout = undefined;
    }
    lastTimeout = window.setTimeout(() => {
        setOwnRand(Math.random());
    }, 3000);
    return (<div>
      <h2>Test page</h2>
      <SubTest authState={authState} parentRand={globalRand}/>
      <ErrorTest parentRand={ownRand}/>
    </div>);
};
export default withGlobal((global) => {
    return {
        authState: global.authState,
        globalRand: Math.random(),
    };
})(Test);
