declare module "ics" {
  export type DateArray = [number, number, number, number?, number?];

  export interface EventAttributes {
    start?: DateArray | undefined;
    end?: DateArray | undefined;
    title?: string | undefined;
    description?: string | undefined;
    location?: string | undefined;
    url?: string | undefined;
  }

  export function createEvent(
    attributes: EventAttributes
  ): { error?: Error; value?: string };

  const _default: {
    createEvent: typeof createEvent;
  };
  export default _default;
}
