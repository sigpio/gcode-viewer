export const createReadStream = () => {
  throw new Error('fs.createReadStream non e supportato in ambiente browser.');
};

export const readFileSync = () => {
  throw new Error('fs.readFileSync non e supportato in ambiente browser.');
};

export default {
  createReadStream,
  readFileSync
};
