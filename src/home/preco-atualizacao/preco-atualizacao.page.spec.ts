import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrecoAtualizacaoPage } from './preco-atualizacao.page';

describe('PrecoAtualizacaoPage', () => {
  let component: PrecoAtualizacaoPage;
  let fixture: ComponentFixture<PrecoAtualizacaoPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(PrecoAtualizacaoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
