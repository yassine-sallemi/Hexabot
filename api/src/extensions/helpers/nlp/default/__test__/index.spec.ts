/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { HttpModule } from '@nestjs/axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { LoggerService } from '@/logger/logger.service';
import { NlpEntityRepository } from '@/nlp/repositories/nlp-entity.repository';
import { NlpSampleEntityRepository } from '@/nlp/repositories/nlp-sample-entity.repository';
import { NlpSampleRepository } from '@/nlp/repositories/nlp-sample.repository';
import { NlpValueRepository } from '@/nlp/repositories/nlp-value.repository';
import { NlpEntityModel } from '@/nlp/schemas/nlp-entity.schema';
import { NlpSampleEntityModel } from '@/nlp/schemas/nlp-sample-entity.schema';
import { NlpSampleModel } from '@/nlp/schemas/nlp-sample.schema';
import { NlpValueModel } from '@/nlp/schemas/nlp-value.schema';
import { NlpEntityService } from '@/nlp/services/nlp-entity.service';
import { NlpSampleEntityService } from '@/nlp/services/nlp-sample-entity.service';
import { NlpSampleService } from '@/nlp/services/nlp-sample.service';
import { NlpValueService } from '@/nlp/services/nlp-value.service';
import { NlpService } from '@/nlp/services/nlp.service';
import { SettingService } from '@/setting/services/setting.service';
import { installNlpSampleEntityFixtures } from '@/utils/test/fixtures/nlpsampleentity';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { entitiesMock, samplesMock } from './__mock__/base.mock';
import {
  nlpBestGuess,
  nlpEmptyFormated,
  nlpFormatted,
  nlpParseResult,
} from './index.mock';
import DefaultNlpHelper from '../index.nlp.helper';

describe('NLP Default Helper', () => {
  let settingService: SettingService;
  let nlpService: NlpService;
  let defaultNlpHelper: DefaultNlpHelper;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installNlpSampleEntityFixtures),
        MongooseModule.forFeature([
          NlpEntityModel,
          NlpValueModel,
          NlpSampleModel,
          NlpSampleEntityModel,
        ]),
        HttpModule,
      ],
      providers: [
        LoggerService,
        {
          provide: SettingService,
          useValue: {
            getSettings: jest.fn(() => ({
              nlp_settings: {
                provider: 'default',
                endpoint: 'path',
                token: 'token',
                languages: ['fr', 'ar', 'tn'],
                default_lang: 'fr',
                threshold: '0.5',
              },
            })),
          },
        },
        NlpService,
        NlpSampleService,
        NlpSampleRepository,
        NlpEntityService,
        NlpEntityRepository,
        NlpValueService,
        NlpValueRepository,
        NlpSampleEntityService,
        NlpSampleEntityRepository,
        EventEmitter2,
        DefaultNlpHelper,
      ],
    }).compile();
    settingService = module.get<SettingService>(SettingService);
    nlpService = module.get<NlpService>(NlpService);
    defaultNlpHelper = module.get<DefaultNlpHelper>(DefaultNlpHelper);
    nlpService.setHelper('default', defaultNlpHelper);
    nlpService.initNLP();
  });

  afterAll(closeInMongodConnection);

  it('should init() properly', () => {
    const nlp = nlpService.getNLP();
    expect(nlp).toBeDefined();
  });

  it('should format empty training set properly', () => {
    const nlp = nlpService.getNLP();
    const results = nlp.format([], entitiesMock);
    expect(results).toEqual(nlpEmptyFormated);
  });

  it('should format training set properly', () => {
    const nlp = nlpService.getNLP();
    const results = nlp.format(samplesMock, entitiesMock);
    expect(results).toEqual(nlpFormatted);
  });

  it('should return best guess from empty parse results', () => {
    const nlp = nlpService.getNLP();
    const results = nlp.bestGuess(
      {
        entities: [],
        intent: {},
        intent_ranking: [],
        text: 'test',
      },
      false,
    );
    expect(results).toEqual({ entities: [] });
  });

  it('should return best guess from parse results', () => {
    const nlp = nlpService.getNLP();
    const results = nlp.bestGuess(nlpParseResult, false);
    expect(results).toEqual(nlpBestGuess);
  });

  it('should return best guess from parse results with threshold', async () => {
    const nlp = nlpService.getNLP();
    const results = nlp.bestGuess(nlpParseResult, true);
    const settings = await settingService.getSettings();
    const thresholdGuess = {
      entities: nlpBestGuess.entities.filter(
        (g) => g.confidence > parseFloat(settings.nlp_settings.threshold),
      ),
    };
    expect(results).toEqual(thresholdGuess);
  });
});
