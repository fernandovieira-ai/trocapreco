import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoricoDetalhePage } from './historico-detalhe.page';

describe('HistoricoDetalhePage', () => {
  let component: HistoricoDetalhePage;
  let fixture: ComponentFixture<HistoricoDetalhePage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(HistoricoDetalhePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
