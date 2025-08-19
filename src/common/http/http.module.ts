import { Module } from '@nestjs/common';
import { HttpClient } from './http.service.js';

@Module({
  providers: [HttpClient],
  exports: [HttpClient],
})
export class HttpClientModule {}
