// Stub for react-native-passkeys — Expo Go does not bundle native passkey modules.
// isSupported() returns false so UI gracefully hides passkey options.
const isSupported = () => false;
const create = async () => null;
const get = async () => null;

module.exports = { isSupported, create, get };
