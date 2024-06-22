import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class UploadService {
  async storeFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('File not provided.');
    }

    // Validate file Extensions
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      throw new BadRequestException(`Invalid file type: ${extension}`);
    }

    //Create File Name
    const filename = `${Date.now()}-${path.basename(file.originalname)}`;

    // Directory where files will be stored
    const uploadsDir = path.join(__dirname , 'uploads'); // Use process.cwd() = root directory

    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory: ${error.message}`);
    }

    try {
      // Store the file with generated filename and full path
      const filePath = path.join(uploadsDir, filename);
      await fs.writeFile(filePath, file.buffer);

      return path.relative(process.cwd(), filePath);
    } catch (error) {
      throw new Error(`Failed to store file: ${error.message}`);
    }
  }
}
