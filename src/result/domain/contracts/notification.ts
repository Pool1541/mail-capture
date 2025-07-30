export interface INotification {
  value: Value[];
}

export interface Value {
  subscriptionId: string;
  subscriptionExpirationDateTime: string;
  clientState: string;
  changeType: string;
  resourceData: ResourceData;
}

export interface ResourceData {
  id: string;
}
