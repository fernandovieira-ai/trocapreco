import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrecobombaPage } from './precobomba.page';

describe('PrecobombaPage', () => {
  let component: PrecobombaPage;
  let fixture: ComponentFixture<PrecobombaPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(PrecobombaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
