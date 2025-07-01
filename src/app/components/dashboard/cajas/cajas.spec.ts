import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cajas } from './cajas';

describe('Cajas', () => {
  let component: Cajas;
  let fixture: ComponentFixture<Cajas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cajas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cajas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
