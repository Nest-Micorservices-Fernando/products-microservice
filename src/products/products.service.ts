import { HttpStatus, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from 'generated/prisma';
import { PaginationDto } from 'src/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger("Product Service");

  onModuleInit() {
    this.$connect();
    this.logger.log('Database connected');
  }

  create(createProductDto: CreateProductDto) {
    
    return this.product.create({
      data: createProductDto
    });

  }

  async findAll( paginationDto: PaginationDto) {
    
    const { page = 1, limit = 10 } = paginationDto;

    const totalPages = await this.product.count({ where: { available: true } });
    const lastpage = Math.ceil(totalPages / limit);

    return {
      data: await this.product.findMany({
        where: { available: true },
        skip: (page - 1) * limit,
        take: limit,
      }),
      total: {
        count: totalPages,
        page: page,
        lastpage: lastpage
      }
    };
  }

  async findOne(id: number) {
    const product = await this.product.findFirst({
      where: { id: id, available: true }
    });

    if (!product) {
      throw new RpcException({
        message: `Product with id ${id} not found`,
        status: HttpStatus.BAD_REQUEST
      });
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {

    const { id: __, ...data } = updateProductDto;

    await this.findOne(id);

    return this.product.update({
      where: { id: id },
      data: data
    })
  }

  async logic_remove(id: number) {

    await this.findOne(id);

    return this.product.delete({
      where: { id: id }
    });
  
  }

    async remove(id: number) {

    await this.findOne(id);


    return this.product.update({
      where: { id: id },
      data: { available: false }
    });
  
  }

  async validateProducts ( ids: number[]) {

    ids = Array.from(new Set(ids));

    const products = await this.product.findMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    if ( products.length != ids.length ) {
      throw new RpcException({
        message: ' Some products weew not found',
        status: HttpStatus.BAD_REQUEST
      })
    }

    return products;

  }


}
