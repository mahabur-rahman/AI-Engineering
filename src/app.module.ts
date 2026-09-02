import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { VectorModule } from './vectors/vector.module';

const envFilePath =
  process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.local';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
    }),
    AiModule,
    VectorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
