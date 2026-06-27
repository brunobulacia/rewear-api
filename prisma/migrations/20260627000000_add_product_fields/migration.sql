-- AlterTable: campos de producto de marca (pivot ropa → productos)
ALTER TABLE "garments" ADD COLUMN     "modelo" TEXT;
ALTER TABLE "garments" ADD COLUMN     "colorway" TEXT;
ALTER TABLE "garments" ADD COLUMN     "condicion" TEXT;
