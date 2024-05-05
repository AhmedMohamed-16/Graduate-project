import { Pharmacy } from 'src/pharmacy/entities/pharmacy.entity';
import { Store } from 'src/store/entities/store.entity';
import { Admin } from '../../admin/entities/admin.entity';
import { CreatePharmacyDto } from 'src/pharmacy/dto/create-pharmacy.dto';
import { CreateAdminDto } from 'src/admin/dto/create-admin.dto';
import { CreateStoreDto } from 'src/store/dto/create-store.dto';

export type User = Admin | Pharmacy | Store;
export type UserWithoutPassword = Omit<User, 'password'>;

export type CreateUserDto = CreatePharmacyDto | CreateAdminDto | CreateStoreDto
