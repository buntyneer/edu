// Base44 integrations removed. Replace these with real implementations.
const noop = async () => ({});

export const Core = {
  InvokeLLM: noop,
  SendEmail: noop,
  UploadFile: noop,
  GenerateImage: noop,
  ExtractDataFromUploadedFile: noop,
  CreateFileSignedUrl: noop,
  UploadPrivateFile: noop,
};

export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const UploadFile = Core.UploadFile;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;
export const CreateFileSignedUrl = Core.CreateFileSignedUrl;
export const UploadPrivateFile = Core.UploadPrivateFile;