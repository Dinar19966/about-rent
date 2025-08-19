import { Controller, Get, Query } from "@nestjs/common";
import { WriteArticleService } from "./llm/write-article.service";

@Controller()
export class AppController {
  constructor(private readonly writer: WriteArticleService) {}

  @Get("brief")
  async brief(@Query("region") region="RU-MOW", @Query("period") period="2025-07") {
    return this.writer.writeRegionBrief(region, period);
  }
}
