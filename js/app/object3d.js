'use strict'

import * as mat4 from '../lib/glmatrix/mat4.js'
import * as vec3 from '../lib/glmatrix/vec3.js'
import * as quat4 from '../lib/glmatrix/quat.js'

import Material from './material.js'


/**
 * @Class
 * Base class for all drawable objects
 * 
 */
class Object3D
{
    /**
     * 
     * @param {WebGL2RenderingContext} gl The webgl2 rendering context
     * @param {Shader} shader The shader to be used to draw the object
     * @param {Array<Float>} vertices List of vertex positions
     * @param {Array<Int>} indices List of vertex indices
     * @param {WebGL2RenderingContext.GL_TRIANGLES | WebGL2RenderingContext.GL_POINTS} draw_mode The draw mode to use. In this assignment we use GL_TRIANGLES and GL_POINTS
     * @param {Material | null} material The material to render the object with
     */
    constructor( gl, shader, vertices, indices, draw_mode, material = null )
    {
        this.shader = shader
        this.material = material

        this.vertices = vertices
        this.vertices_buffer = null
        this.createVBO( gl )

        this.indices = indices
        this.index_buffer = null
        this.createIBO( gl )

        this.draw_mode = draw_mode

        this.num_components_vec3 = 3
        this.num_components_vec2 = 2

        this.vertex_array_object = null
        this.createVAO( gl, shader )

        this.model_matrix = mat4.identity(mat4.create())
    }

    /**
     * Change the object's shader
     * 
     * @param {WebGL2RenderingContext} gl The webgl2 rendering context
     * @param {Shader} shader An instance of the shader to be used
     */
    setShader( gl, shader ) {
        this.shader = shader
        gl.deleteVertexArray(this.vertex_array_object)
        this.createVAO( gl, shader )
    }

    /**
     * Change the object's draw mode
     * 
     * @param {WebGL2RenderingContext.GL_TRIANGLES | WebGL2RenderingContext.GL_POINTS} draw_mode The draw mode to use. In this assignment we use GL_TRIANGLES and GL_POINTS
     */
    setDrawMode( draw_mode ) {
        this.draw_mode = draw_mode
    }

    /**
     * Set this object's model transformation
     * 
     * @param {mat4} transformation glmatrix matrix representing the matrix
     */
    setTransformation( transformation ) {
        this.model_matrix = transformation
    }

    /**
     * Sets up a vertex attribute object that is used during rendering to automatically tell WebGL how to access our buffers
     * 
     * @param { WebGL2RenderingContext } gl The webgl2 rendering context
     * @param {Shader} shader The shader to be used to draw the object
     */
    createVAO( gl, shader )
    {
        this.vertex_array_object = gl.createVertexArray();
        gl.bindVertexArray(this.vertex_array_object);
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vertices_buffer )

        let location = shader.getAttributeLocation( 'a_position' )
        let stride = 0, offset = 0
        if (location >= 0) {
            gl.enableVertexAttribArray( location )
            stride = 0, offset = 0
            gl.vertexAttribPointer( location, this.num_components_vec3, gl.FLOAT, false, stride, offset )
        }

        location = shader.getAttributeLocation( 'a_normal' )
        if (location >= 0) {
            gl.enableVertexAttribArray( location )
            stride = 0, offset = (this.vertices.length / 2) * Float32Array.BYTES_PER_ELEMENT
            gl.vertexAttribPointer( location, this.num_components_vec3, gl.FLOAT, false, stride, offset )
        }

        gl.bindVertexArray( null )
        gl.bindBuffer( gl.ARRAY_BUFFER, null )
    }

    /**
     * Creates vertex buffer object for vertex data
     * 
     * @param { WebGL2RenderingContext } gl The webgl2 rendering context
     */
    createVBO( gl )
    {
        this.vertices_buffer = gl.createBuffer( );
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vertices_buffer )
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW )
        gl.bindBuffer( gl.ARRAY_BUFFER, null );
    }

    /**
     * Creates index buffer object for vertex data
     * 
     * @param { WebGL2RenderingContext } gl The webgl2 rendering context
     */
    createIBO( gl )
    {
        this.index_buffer = gl.createBuffer( );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.index_buffer )
        gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices), gl.STATIC_DRAW )
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
    }

    /**
     * Perform any necessary updates. 
     * Children can override this.
     * 
     */
    udpate( ) 
    {
        return
    }

    /**
     * Render call for an individual object.
     * 
     * @param { WebGL2RenderingContext } gl The webgl2 rendering context
     */
    render( gl )
    {
        // Bind vertex array object
        gl.bindVertexArray( this.vertex_array_object )

        // Bind index buffer
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.index_buffer )

        // Set up shader
        this.shader.use( )
        this.shader.setUniform4x4f('u_m', this.model_matrix)

        // Draw the element
        gl.drawElements( this.draw_mode, this.indices.length, gl.UNSIGNED_INT, 0 )

        // Clean Up
        gl.bindVertexArray( null )
        gl.bindBuffer( gl.ARRAY_BUFFER, null )
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null )
        this.shader.unuse( )
    }

}

/**
 * In addition to Object3D's functionality, ShadedObject3Ds have a material
 * This material is used to shade an object and its properties need to be 
 * passed to the object's shader 
 * 
 */
class ShadedObject3D extends Object3D { 

    /**
     * @param {WebGL2RenderingContext} gl The webgl2 rendering context
     * @param {Shader} shader The shader to be used to draw the object
     * @param {Array<Float>} vertices List of vertex positions
     * @param {Array<Int>} indices List of vertex indices
     * @param {WebGL2RenderingContext.GL_TRIANGLES | WebGL2RenderingContext.GL_POINTS} draw_mode The draw mode to use. In this assignment we use GL_TRIANGLES and GL_POINTS
     * @param {Material} material The material to render the object with
     */
     constructor( gl, shader, vertices, indices, draw_mode, material ) {
        super(gl, shader, vertices, indices, draw_mode, material)
     }

    /**
     * Sets up a vertex attribute object that is used during rendering to automatically tell WebGL how to access our buffers
     * 
     * @param { WebGL2RenderingContext } gl The webgl2 rendering context
     * @param {Shader} shader The shader to be used to draw the object
     */
    createVAO( gl, shader )
    {
        //throw '"ShadedObject3D.createVAO" is incomplete'
        // NOTE: There are now two versions of this.num_components -> this.num_components_vec3 and this.num_components_vec2 to accommodate texture coordinate data

        this.vertex_array_object = gl.createVertexArray();
        gl.bindVertexArray(this.vertex_array_object);
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vertices_buffer )

        let byteLength = Float32Array.BYTES_PER_ELEMENT;
        let offset = 0;
        let stride = 6 * byteLength // 3 position + 3 normal
        stride += this.material.hasTexture() ? 5* byteLength : 0 // +5 = 3 tangent + 2 texture coord
        

        let location = shader.getAttributeLocation( 'a_position' )
        if (location >= 0) {
            // TODO: Set up position attribute
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, this.num_components_vec3, gl.FLOAT, false, stride, offset);
            offset += 3 * byteLength;
        }

        location = shader.getAttributeLocation( 'a_normal' )
        if (location >= 0) {
            // TODO: Set up normal attribute
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, this.num_components_vec3, gl.FLOAT, false, stride, offset);
            offset += 3 * byteLength;
        }

        location = shader.getAttributeLocation( 'a_tangent' )
        if (location >= 0 && this.material.hasTexture()) {
            // TODO: Set up tangent attribute           
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, this.num_components_vec3, gl.FLOAT, false, stride, offset);
            offset += 3 * byteLength;
        }

        location = shader.getAttributeLocation( 'a_texture_coord' )
        if (location >= 0 && this.material.hasTexture()) {
            // TODO: Set up texture coordinate attribute
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, this.num_components_vec2, gl.FLOAT, false, stride, offset);
        }

        gl.bindVertexArray( null )
        gl.bindBuffer( gl.ARRAY_BUFFER, null )
    }

    /**
     * Render call for an individual object.
     * This method passes the material properties to the object's shader
     * and subsequently calls its parent's render method
     * 
     * @param { WebGL2RenderingContext } gl The webgl2 rendering context
     */
    render( gl )
    {
        this.shader.use( )

        // TODO: Pass basic material properties (kA, kD, kS, shininess)
        this.shader.setUniform3f('u_material.kA', new Float32Array(this.material.kA));
        this.shader.setUniform3f('u_material.kD', new Float32Array(this.material.kD));
        this.shader.setUniform3f('u_material.kS', new Float32Array(this.material.kS));
        this.shader.setUniform1f('u_material.shininess', this.material.shininess);

        // TODO: Associate the sampler uniforms (map_kD, map_nS, map_norm) in the shader's u_material with different texture units
        // TODO: Activate and bind texture units if textures are present in the material
        if (this.material.hasMapKD()) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.material.getMapKD());
            this.shader.setUniform1i('u_material.map_kD', 0);
        }

        if (this.material.hasMapNS()) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.material.getMapNS());
            this.shader.setUniform1i('u_material.map_nS', 1);
        }

        if (this.material.hasMapNorm()) {
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, this.material.getMapNorm());
            this.shader.setUniform1i('u_material.map_norm', 2);
        }

        // puting it early IT WORKS
        super.render( gl )

        //gl.bindTexture(gl.TEXTURE_2D,null)
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, null);


        this.shader.unuse( )

        
    }
}

export {
    Object3D,
    ShadedObject3D,
}