import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SearchService } from './search.service';
import { ClientOptions } from '@elastic/elasticsearch';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): ClientOptions => {
        const node =
          config.get<string>('ELASTICSEARCH_NODE') ?? 'http://localhost:9200';

        const username = config.get<string>('ELASTICSEARCH_USERNAME');
        const password = config.get<string>('ELASTICSEARCH_PASSWORD');

        const options: ClientOptions = {
          node,
        };

        if (username && password) {
          options.auth = {
            username,
            password,
          };
        }

        return options;
      },
    }),
  ],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
