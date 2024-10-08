/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Prop, Schema, SchemaFactory, ModelDefinition } from '@nestjs/mongoose';
import { THydratedDocument } from 'mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';

@Schema({ timestamps: true })
export class Category extends BaseSchema {
  @Prop({
    type: String,
    unique: true,
    required: true,
  })
  label: string;

  @Prop({
    type: Boolean,
    default: false,
  })
  builtin?: boolean;

  @Prop({
    type: Number,
    default: 100,
  })
  zoom?: number;

  @Prop({
    type: [Number, Number],
    default: [0, 0],
  })
  offset?: [number, number];
}

export const CategoryModel: ModelDefinition = LifecycleHookManager.attach({
  name: Category.name,
  schema: SchemaFactory.createForClass(Category),
});

export type CategoryDocument = THydratedDocument<Category>;

export default CategoryModel.schema;
