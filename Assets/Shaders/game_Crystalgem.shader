Shader "game/gameCrystal"
{
	Properties
	{
		
		_Layer0Tex ("Layer 1 Texture", 2D) = "white" {}
		_Layer0Tint("Layer 1 Tint", COLOR) = (1,1,1,1)
		//_Layer0SpeedX("Scroll Speed X", Range(-1.0, 1.0)) = 0
		//_Layer0SpeedY("Scroll Speed Y", Range(-1.0, 1.0)) = 0


		[Header(Volumetric Marble)]
		_MarbleTex ("Marble Heightmap Texture", 2D) = "black" {}
		_MarbleHeightScale("Marble Height Scale", Range(0.0, 0.5)) = 0.1
		_MarbleHeightCausticOffset("Marble Caustic Offset", Range(-5.0, 5.0)) = 0.1


		[Header(Fresnel)]
		[Toggle(EnableFresnel)] _EnableFresnel("Enable", Float) = 1
		_FresnelTightness("Fresnel Tightness", Range(0.0, 10.0)) = 4.0
		[HDR] _FresnelColorInside("Fresnel Color Inside", COLOR) = (1,1,0.5,1)
		[HDR] _FresnelColorOutside("Fresnel Color Outside", COLOR) = (1,1,1,1)

		[Header(Surface Mask)]
		[Toggle(EnableSurfaceMask)] _EnableSurfaceMask("Enable", Float) = 0
		_SurfaceAlphaMaskTex("Surface Alpha Mask Texture", 2D) = "white" {}
		[HDR] _SurfaceAlphaColor("Surface Mask Color", COLOR) = (1,1,1,1)

		[Header(Inner Light)]
		[Toggle(EnableInnerLight)] _EnableInnerLight("Enable", Float) = 0
		_InnerLightTightness("Inner Light Tightness", Range(0.0, 40.0)) = 20.0
		[HDR] _InnerLightColorInside("Inner Light Color Inside", COLOR) = (1,1,1,1)
		[HDR] _InnerLightColorOutside("Inner Light Color Outside", COLOR) = (1,1,0,1)


	}

	SubShader
	{
		Tags { "RenderType" = "Opaque" "RenderPipeline" = "UniversalRenderPipeline" "IgnoreProjector" = "True"}
		LOD 100

		Pass
		{
			CGPROGRAM

			#pragma shader_feature __ EnableLayer0
			#pragma shader_feature __ EnableFresnel
			#pragma shader_feature __ EnableSurfaceMask
			#pragma shader_feature __ EnableInnerLight
		

			#pragma vertex vertVolumetric
			#pragma fragment fragVolumetric

			#include "Volumetric.cginc"

			ENDCG
		}
	}

	SubShader
	{
		Tags { "RenderType" = "Opaque"  "IgnoreProjector" = "True"}
		LOD 100

		Pass
		{
			CGPROGRAM

			#pragma shader_feature __ EnableLayer0
			#pragma shader_feature __ EnableFresnel
			#pragma shader_feature __ EnableSurfaceMask
			#pragma shader_feature __ EnableInnerLight

			#pragma vertex vertVolumetric
			#pragma fragment fragVolumetric

			#include "Volumetric.cginc"

			ENDCG
		}
	}

	SubShader
	{
		Tags { "RenderType" = "Opaque" "IgnoreProjector" = "True"}
        LOD 100

		Pass
		{
			CGPROGRAM

			#pragma shader_feature __ EnableLayer0	
			#pragma shader_feature __ EnableFresnel
			#pragma shader_feature __ EnableSurfaceMask
			#pragma shader_feature __ EnableInnerLight

			#pragma vertex vertVolumetric
			#pragma fragment fragVolumetric

			#include "Volumetric.cginc"

			ENDCG
		}
	}

	SubShader
	{
		Tags{ "LightMode" = "ForwardBase" } 
		LOD 200

		Pass
		{
			CGPROGRAM

			#pragma shader_feature __ EnableLayer0
			#pragma shader_feature __ EnableFresnel
			#pragma shader_feature __ EnableSurfaceMask
			#pragma shader_feature __ EnableInnerLight

			#pragma vertex vertVolumetric
			#pragma fragment fragVolumetric

			#include "Volumetric.cginc"

			ENDCG
		}
	}

	Fallback "VertexLit"
}
