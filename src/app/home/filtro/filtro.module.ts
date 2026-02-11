import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { FiltroPageRoutingModule } from "./filtro-routing.module";

import { FiltroPage } from "./filtro.page";

import { ScrollingModule } from "@angular/cdk/scrolling";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FiltroPageRoutingModule,
    ScrollingModule,
  ],
  declarations: [FiltroPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FiltroPageModule {}
