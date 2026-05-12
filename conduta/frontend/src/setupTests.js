import '@testing-library/jest-dom';

// jsdom não implementa URL.createObjectURL — necessário para testes com File/Blob
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = () => 'blob:mock';
}
