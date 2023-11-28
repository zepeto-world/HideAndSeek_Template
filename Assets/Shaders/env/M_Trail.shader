Shader "Particle/Shaders/M_Trail"
{
	Properties
	{
		_TintColor ("Tint Color", Color) = (0.5,0.5,0.5,0.5)
		_MainTex ("Particle Texture", 2D) = "white" {}
		_InvFade ("Soft Particles Factor", Range(0.01,3.0)) = 1.0
		[Enum(UnityEngine.Rendering.BlendMode)]_SrcBlend("SrcBlend", Int) = 5
		[Enum(UnityEngine.Rendering.BlendMode)]_DstBlend("DstBlend", Int) = 10
		_EmissiveMultiply("Emissive Multiply", Float) = 1
		_OpacityMultiply("Opacity Multiply", Float) = 1
		_MainTiling("Main Tiling", Vector) = (1,1,1,1)
		_MainTexturePower("Main Texture Power", Float) = 1
		[KeywordEnum(None,Add,Lerp)] _Blend("Blend", Float) = 0
		_TimeScale1("Time Scale 1", Float) = 1
		_TimeScale2("Time Scale 2", Float) = 1
		[Toggle]_UseTextureMaskAlpha("Use Texture Mask Alpha", Float) = 1
		_TextureMaskAlpha("Texture Mask Alpha", 2D) = "white" {}
		[HideInInspector] _texcoord( "", 2D ) = "white" {}

	}


	Category 
	{
		SubShader
		{
		LOD 0

			Tags { "Queue"="Transparent" "IgnoreProjector"="True" "RenderType"="Transparent" "PreviewType"="Plane" }
			Blend [_SrcBlend] [_DstBlend]
			ColorMask RGB
			Cull Off
			Lighting Off 
			ZWrite Off
			ZTest LEqual
			
			Pass {
			
				CGPROGRAM
				
				#ifndef UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX
				#define UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(input)
				#endif
				
				#pragma vertex vert
				#pragma fragment frag
				#pragma target 2.0
				#pragma multi_compile_instancing
				#pragma multi_compile_particles
				#pragma multi_compile_fog
				#include "UnityShaderVariables.cginc"
				#define ASE_NEEDS_FRAG_COLOR
				#pragma multi_compile_local _BLEND_NONE _BLEND_ADD _BLEND_LERP


				#include "UnityCG.cginc"

				struct appdata_t 
				{
					float4 vertex : POSITION;
					fixed4 color : COLOR;
					float4 texcoord : TEXCOORD0;
					UNITY_VERTEX_INPUT_INSTANCE_ID
					
				};

				struct v2f 
				{
					float4 vertex : SV_POSITION;
					fixed4 color : COLOR;
					float4 texcoord : TEXCOORD0;
					UNITY_FOG_COORDS(1)
					#ifdef SOFTPARTICLES_ON
					float4 projPos : TEXCOORD2;
					#endif
					UNITY_VERTEX_INPUT_INSTANCE_ID
					UNITY_VERTEX_OUTPUT_STEREO
					
				};
				
				
				#if UNITY_VERSION >= 560
				UNITY_DECLARE_DEPTH_TEXTURE( _CameraDepthTexture );
				#else
				uniform sampler2D_float _CameraDepthTexture;
				#endif
				uniform sampler2D _MainTex;
				uniform fixed4 _TintColor;
				uniform float4 _MainTex_ST;
				uniform float _InvFade;
				uniform int _DstBlend;
				uniform int _SrcBlend;
				uniform float _EmissiveMultiply;
				uniform float _TimeScale1;
				uniform float4 _MainTiling;
				uniform float _MainTexturePower;
				uniform float _TimeScale2;
				uniform float _UseTextureMaskAlpha;
				uniform sampler2D _TextureMaskAlpha;
				SamplerState sampler_TextureMaskAlpha;
				uniform float4 _TextureMaskAlpha_ST;
				uniform float _OpacityMultiply;


				v2f vert ( appdata_t v  )
				{
					v2f o;
					UNITY_SETUP_INSTANCE_ID(v);
					UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
					UNITY_TRANSFER_INSTANCE_ID(v, o);
					

					v.vertex.xyz +=  float3( 0, 0, 0 ) ;
					o.vertex = UnityObjectToClipPos(v.vertex);
					#ifdef SOFTPARTICLES_ON
						o.projPos = ComputeScreenPos (o.vertex);
						COMPUTE_EYEDEPTH(o.projPos.z);
					#endif
					o.color = v.color;
					o.texcoord = v.texcoord;
					UNITY_TRANSFER_FOG(o,o.vertex);
					return o;
				}

				fixed4 frag ( v2f i  ) : SV_Target
				{
					UNITY_SETUP_INSTANCE_ID( i );
					UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX( i );

					#ifdef SOFTPARTICLES_ON
						float sceneZ = LinearEyeDepth (SAMPLE_DEPTH_TEXTURE_PROJ(_CameraDepthTexture, UNITY_PROJ_COORD(i.projPos)));
						float partZ = i.projPos.z;
						float fade = saturate (_InvFade * (sceneZ-partZ));
						i.color.a *= fade;
					#endif

					float mulTime57 = _Time.y * _TimeScale1;
					float2 texCoord122 = i.texcoord.xy * (_MainTiling).xy + float2( 0,0 );
					float2 panner66 = ( mulTime57 * float2( -1,0 ) + texCoord122);
					float4 temp_cast_0 = (_MainTexturePower).xxxx;
					float4 temp_output_244_0 = pow( tex2D( _MainTex, panner66 ) , temp_cast_0 );
					float mulTime257 = _Time.y * _TimeScale2;
					float2 texCoord252 = i.texcoord.xy * (_MainTiling).zw + float2( 0,0 );
					float2 panner255 = ( mulTime257 * float2( -1,0 ) + texCoord252);
					float4 temp_cast_1 = (_MainTexturePower).xxxx;
					float4 temp_output_266_0 = pow( tex2D( _MainTex, panner255 ) , temp_cast_1 );
					float4 lerpResult304 = lerp( temp_output_244_0 , temp_output_266_0 , 0.5);
					#if defined(_BLEND_NONE)
					float4 staticSwitch263 = temp_output_244_0;
					#elif defined(_BLEND_ADD)
					float4 staticSwitch263 = ( temp_output_244_0 + temp_output_266_0 );
					#elif defined(_BLEND_LERP)
					float4 staticSwitch263 = lerpResult304;
					#else
					float4 staticSwitch263 = temp_output_244_0;
					#endif
					float2 uv_TextureMaskAlpha = i.texcoord.xy * _TextureMaskAlpha_ST.xy + _TextureMaskAlpha_ST.zw;
					float4 temp_output_86_0 = ( staticSwitch263 * i.color * _TintColor * (( _UseTextureMaskAlpha )?( tex2D( _TextureMaskAlpha, uv_TextureMaskAlpha ).r ):( 1.0 )) * unity_ColorSpaceDouble );
					float4 appendResult187 = (float4(( _EmissiveMultiply * (temp_output_86_0).rgb ) , saturate( ( (temp_output_86_0).a * _OpacityMultiply ) )));
					

					fixed4 col = appendResult187;
					UNITY_APPLY_FOG(i.fogCoord, col);
					return col;
				}
				ENDCG 
			}
		}	
	}
	CustomEditor "ASEMaterialInspector"
	
	
}
