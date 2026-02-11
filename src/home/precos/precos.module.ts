import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PrecosPageRoutingModule } from './precos-routing.module';

import { PrecosPage } from './precos.page';

import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PrecosPageRoutingModule,
    ScrollingModule
  ],
  declarations: [PrecosPage]
})
export class PrecosPageModule {}
