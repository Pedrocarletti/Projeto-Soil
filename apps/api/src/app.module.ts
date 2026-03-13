import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { FarmsModule } from './farms/farms.module';
import { PivotsModule } from './pivots/pivots.module';
import { PrismaModule } from './prisma/prisma.module';
import { RealtimeModule } from './realtime/realtime.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { UsersModule } from './users/users.module';
import { WeatherModule } from './weather/weather.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    RealtimeModule,
    UsersModule,
    AuthModule,
    FarmsModule,
    TelemetryModule,
    PivotsModule,
    WeatherModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
