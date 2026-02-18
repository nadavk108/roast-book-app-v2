import { Inngest, EventSchemas } from 'inngest';

type Events = {
  'video/generation.requested': {
    data: {
      bookId: string;
      slug: string;
      victimName: string;
      quotes: string[];
      coverImageUrl: string;
      fullImageUrls: string[];
    };
  };
};

export const inngest = new Inngest({
  id: 'roast-book-app',
  schemas: new EventSchemas().fromRecord<Events>(),
});
