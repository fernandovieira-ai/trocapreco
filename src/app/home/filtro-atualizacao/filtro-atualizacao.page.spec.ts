import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FiltroAtualizacaoPage } from './filtro-atualizacao.page';

describe('FiltroAtualizacaoPage', () => {
  let component: FiltroAtualizacaoPage;
  let fixture: ComponentFixture<FiltroAtualizacaoPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(FiltroAtualizacaoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
