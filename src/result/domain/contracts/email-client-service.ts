export interface MessageData {
  id: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  receivedDateTime: string;
  sentDateTime: string;
  hasAttachments: boolean;
  subject: string;
  bodyPreview: string;
  importance: string;
  isRead: boolean;
  isDraft: boolean;
  body: Body;
  sender: Sender;
  from: From;
  toRecipients: ToRecipient[];
}

export interface Body {
  contentType: string;
  content: string;
}

export interface EmailAddress {
  name: string;
  address: string;
}

export interface Sender {
  emailAddress: EmailAddress;
}

export interface From {
  emailAddress: EmailAddress;
}

export interface ToRecipient {
  emailAddress: EmailAddress;
}

export interface IEmailClientService {
  getAccessToken(): Promise<string>;
  getMessageById(messageId: string): Promise<MessageData | null>;
}
