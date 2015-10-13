import os
import base64

images_path = '../story-js/images/'

for filename in os.listdir(images_path):
    image_file_name = os.path.join(images_path, filename)

    if image_file_name.upper().endswith('PNG'):
        print 'PNG', image_file_name

        output = open(os.path.join(images_path, filename + '.js'), 'w')
        output.write('define(function (require) {\n')
        output.write('\n')

        png_content = file(image_file_name).read()

        output.write("return 'data:image/png;base64,%s';\n" %
                     base64.b64encode(png_content))
        output.write('});')
        output.close()


