/** Process environment before .env loads, these values win over .env */
const externalEnv = { ...process.env };

export default externalEnv;
