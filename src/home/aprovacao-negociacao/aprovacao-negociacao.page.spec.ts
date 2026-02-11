import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AprovacaoNegociacaoPage } from './aprovacao-negociacao.page';

describe('AprovacaoNegociacaoPage', () => {
  let component: AprovacaoNegociacaoPage;
  let fixture: ComponentFixture<AprovacaoNegociacaoPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AprovacaoNegociacaoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
